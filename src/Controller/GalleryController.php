<?php

namespace AmzsCMS\GalleryBundle\Controller;

use AmzsCMS\GalleryBundle\Constant\GalleryRoute;
use AmzsCMS\GalleryBundle\Entity\Gallery;
use AmzsCMS\GalleryBundle\Entity\GalleryPictures;
use AmzsCMS\GalleryBundle\Entity\Picture;
use AmzsCMS\GalleryBundle\Form\GalleryPicturesType;
use AmzsCMS\GalleryBundle\Form\ManageGalleryFormType;
use AmzsCMS\GalleryBundle\Services\GalleryPictureService;
use AmzsCMS\GalleryBundle\Services\GalleryService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Vich\UploaderBundle\Storage\StorageInterface;

class GalleryController extends AbstractController
{

    private function prepareGalleryData(Request $request, GalleryService $galleryService, GalleryPictureService $galleryPictureService, int $pictureLimit = 15): array
    {
        $folderId = $request->query->getInt('folderId', 0);
        $page     = $request->query->getInt('page', 1);

        $currentFolder = ($folderId > 0)
            ? $galleryService->find($folderId)
            : null;

        $folders = ($page === 1)
            ? $galleryService->getFolders($currentFolder)
            : [];

        return [
            'folders'         => $folders,
            'sidebarFolders'  => $galleryService->getSidebarFolders(),
            'pictures'        => $galleryPictureService->getPaginatedPictures(
                $currentFolder,
                $page,
                $pictureLimit
            ),
            'breadcrumbs'     => $galleryService->getBreadcrumbs($currentFolder),
            'currentFolderId' => $folderId
        ];
    }
    public function index(
        Request $request,
        GalleryService $galleryService,
        GalleryPictureService $galleryPictureService
    ): Response {
        $data = $this->prepareGalleryData($request, $galleryService, $galleryPictureService,15);

        if ($request->headers->get('Turbo-Frame') === 'media_library_spa') {
            return $this->render('@AmzsGallery/gallery/_content.html.twig', $data);
        }

        return $this->render('@AmzsGallery/gallery/index.html.twig', $data);
    }

    public function modal(
        Request $request,
        GalleryService $galleryService,
        GalleryPictureService $galleryPictureService
    ): Response {
        $data = $this->prepareGalleryData($request, $galleryService, $galleryPictureService,10  );
        $data['isModal'] = true;

        if ($request->headers->get('Turbo-Frame') === 'gallery_main_content') {
            return $this->render('@AmzsGallery/gallery/_main_content.html.twig', $data);
        }

        if ($request->headers->get('X-Requested-With') === 'XMLHttpRequest') {
            return $this->render('@AmzsGallery/gallery/_content_modal.html.twig', $data);
        }

        return $this->render('@AmzsGallery/gallery/modal.html.twig', $data);
    }

    public function delete(int $id, GalleryService $galleryService, EntityManagerInterface $manager): JsonResponse
    {
        $gallery = $galleryService->find($id);
        $manager->remove($gallery);
        $manager->flush();

        return new JsonResponse(['message' => 'Folder and all pictures deleted successfully']);
    }

    public function add(EntityManagerInterface $manager, Request $request, int $id = 0): Response
    {
        $gallery = new Gallery();

        if ($id > 0) {
            $parent = $manager->getRepository(Gallery::class)->find($id);
            if ($parent) {
                $gallery->setParent($parent);
            }
        }

        $form = $this->createForm(ManageGalleryFormType::class, $gallery, [
            'action' => $this->generateUrl(GalleryRoute::ADD, ['id' => $id]),
        ]);

        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $manager->persist($gallery);
            $manager->flush();

            return new JsonResponse(['message' => 'Gallery added successfully'], Response::HTTP_CREATED);
        }

        return $this->render('@AmzsGallery/gallery/add_or_edit.html.twig', [
            'title'   => "Add gallery",
            'gallery' => $gallery,
            'form'    => $form->createView()
        ]);
    }

    public function edit(int $id, Request $request, GalleryService $galleryService, EntityManagerInterface $manager): Response
    {
        $gallery = $galleryService->find($id);

        $form = $this->createForm(ManageGalleryFormType::class, $gallery, [
            'action' => $this->generateUrl(GalleryRoute::EDIT, ['id' => $gallery->getId()]),
        ]);

        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $manager->persist($gallery);
            $manager->flush();

            return new JsonResponse(['message' => 'Gallery edited successfully'], Response::HTTP_CREATED);
        }

        return $this->render('@AmzsGallery/gallery/add_or_edit.html.twig', [
            'title'   => "Edit gallery",
            'gallery' => $gallery,
            'form'    => $form->createView()
        ]);
    }

    public function editPicture(
        Request $request,
        EntityManagerInterface $em,
        $galleryPictureId
    ): Response {
        $galleryPicture = $em->getRepository(GalleryPictures::class)->find($galleryPictureId);

        if (!$galleryPicture) {
            throw new NotFoundHttpException('Không tìm thấy ảnh này trong thư viện!');
        }

        $form = $this->createForm(GalleryPicturesType::class, $galleryPicture, [
            'action' => $this->generateUrl('amzs_admin_gallery_edit_picture_route', ['galleryPictureId' => $galleryPictureId]),
            'method' => 'POST',
        ]);

        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $em->flush();
            return new JsonResponse(['status' => 'success', 'message' => 'Cập nhật thành công!'], 200);
        }

        return $this->render('@AmzsGallery/gallery/edit_picture.html.twig', [
            'form'           => $form->createView(),
            'galleryPicture' => $galleryPicture
        ]);
    }

    public function deletePicture(
        int $galleryPictureId,
        EntityManagerInterface $manager
    ): Response {
        $galleryPicture = $manager->getRepository(GalleryPictures::class)->find($galleryPictureId);

        if (empty($galleryPicture)) {
            return new JsonResponse(['error' => 'Không tìm thấy ảnh này trong hệ thống!'], 404);
        }

        $manager->remove($galleryPicture);
        $manager->flush();

        return new JsonResponse([
            'message' => 'Picture deleted successfully',
        ]);
    }

    public function upload(
        Request $request,
        EntityManagerInterface $em,
        StorageInterface $storage
    ): Response {
        $uploadedFile = $request->files->get('file');

        if (!$uploadedFile) {
            return new JsonResponse([
                'success' => false,
                'error'   => 'Không tìm thấy file nào được chọn.'
            ], 400);
        }

        $folderId = (int) $request->request->get('folderId');
        $gallery = ($folderId > 0) ? $em->getRepository(Gallery::class)->find($folderId) : null;

        $picture = new Picture();
        if ($gallery) {
            $picture->setGallery($gallery);
        }
        $picture->setFile($uploadedFile);

        try {
            $em->persist($picture);
            $em->flush();

            $galleryPicture = new GalleryPictures();
            $galleryPicture->setPicture($picture);

            if ($gallery) {
                $galleryPicture->setGallery($gallery);
            }

            $imagePath = $storage->resolveUri($picture, 'file');

            if (method_exists($galleryPicture, 'setImage')) {
                $galleryPicture->setImage($imagePath);
            }

            $em->persist($galleryPicture);
            $em->flush();

            return new JsonResponse([
                'success'            => true,
                'message'            => 'Tải ảnh và lưu vào thư viện thành công!',
                'id'                 => $picture->getId(),
                'gallery_picture_id' => $galleryPicture->getId(),
                'image_path'         => $imagePath,
                'fileName'           => $picture->getFileName(),
            ], 200);

        } catch (\Throwable $e) {
            return new JsonResponse([
                'success' => false,
                'error'   => $e->getMessage()
            ], 500);
        }
    }
}