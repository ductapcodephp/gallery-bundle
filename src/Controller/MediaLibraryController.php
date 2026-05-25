<?php

declare(strict_types=1);

namespace AmzsCMS\GalleryBundle\Controller;

use AmzsCMS\GalleryBundle\Entity\Gallery;
use AmzsCMS\GalleryBundle\Entity\Picture;
use AmzsCMS\GalleryBundle\Form\PictureType;
use AmzsCMS\GalleryBundle\Services\PictureService;
use Doctrine\ORM\EntityManagerInterface;
use InvalidArgumentException;
use Knp\Component\Pager\PaginatorInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Vich\UploaderBundle\Templating\Helper\UploaderHelper;

class MediaLibraryController extends AbstractController
{

//    public function media(Request $request): Response
//    {
//        $eventName = $request->query->get('event');
//        $uuid = $request->query->get('uuid');
//        $eventRegister= $request->get('eventRegister');
//        $blockId = $request->query->get('blockId');
//        $prop = $request->query->get('prop');
//        return $this->render(
//            '@AdminPartials/media_library/open_list_management_modal.html.twig',
//            compact('eventName', 'uuid', 'blockId','eventRegister', 'prop')
//        );
//    }


    public function upload(
        Request $request,
        EntityManagerInterface $em
    ): Response {
        $uploadedFile = $request->files->get('file');

        if (!$uploadedFile) {

            return new JsonResponse([
                'success' => false,
                'error' => 'Không tìm thấy file nào được chọn.'
            ], 400);
        }

        $picture = new Picture();

        $folderId = (int) $request->request->get('folderId');

        if ($folderId > 0) {

            $gallery = $em
                ->getRepository(Gallery::class)
                ->find($folderId);

            if ($gallery) {
                $picture->setGallery($gallery);
            }
        }
        $picture->setFile($uploadedFile);
        try {

            $em->persist($picture);

            $em->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Tải ảnh lên thành công!',
                'id' => $picture->getId(),
                'fileName' => $picture->getFileName(),
            ], 200);

        } catch (\Throwable $e) {

            return new JsonResponse([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

//    public function ajaxList(
//        PictureService $pictureService,
//        PaginatorInterface $paginator,
//        Request $request,
//        UploaderHelper $uploaderHelper
//    ): JsonResponse
//    {
//        $page = $request->query->getInt('page', 1);
//        $search = $request->query->get('search');
//        $perPage = 15;
//
//        $query = $pictureService->findAllPicture($search);
//
//        $pagination = $paginator->paginate($query, $page, $perPage);
//
//        $items = [];
//        /** @var Picture $picture */
//        foreach ($pagination as $picture) {
//            $url = $uploaderHelper->asset($picture);
//            $items[] = [
//                'id'            => $picture->getId(),
//                'originalName'  => $picture->getOriginalName() ?: $picture->getName(),
//                'fileSize'      => $picture->getFileSize(),
//                'mimeType'      => $picture->getMimeType(),
//                'fileName'      => $picture->getFileName(),
//                // Cách sạch và đúng nhất:
//                'url'           => $url ?: '/'. $picture->getImage(),   // ← Quan trọng
//                'thumb'         => $url ?: '/'. $picture->getImage(),   // nếu chưa có thumb riêng
//            ];
//        }
//
//        return $this->json([
//            'success' => true,
//            'items' => $items,
//            'pagination' => [
//                'currentPage' => $pagination->getCurrentPageNumber(),
//                'totalPages'  => ceil($pagination->getTotalItemCount() / $perPage),
//                'totalItems'  => $pagination->getTotalItemCount(),
//            ]
//        ]);
//    }

}
