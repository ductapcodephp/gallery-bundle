<?php

namespace AmzsCMS\GalleryBundle\DataTable;

use AmzsCMS\CoreBundle\Service\Datatable\BaseDataTable;
use AmzsCMS\GalleryBundle\Entity\Gallery;
use AmzsCMS\GalleryBundle\Repository\GalleryRepository;
use Doctrine\ORM\QueryBuilder;
use Symfony\Component\HttpFoundation\Request;

class GalleryChildDataTable extends BaseDataTable
{
    protected $entityAlias = 'gallery';

    public function __construct(
        GalleryRepository $repository
    ) {
        parent::__construct($repository);
    }

    protected function createBaseQueryBuilder(): QueryBuilder
    {
        return $this->repository
            ->createQueryBuilder('gallery')

            ->where('gallery.type = :type')
            ->setParameter('type', 'folder')

            ->orderBy('gallery.lft', 'ASC');
    }

    protected function applyDefaultFilters(
        QueryBuilder $qb,
        Request $request
    ): void {

    }

    protected function applyCustomFilters(
        QueryBuilder $qb,
        Request $request
    ): void {

        $parentId = $request->query->get('parentId');

        if (empty($parentId)) {
            $qb->andWhere('gallery.parent IS NULL');
            return;
        }

        $qb->andWhere('gallery.parent = :parentId')
            ->setParameter('parentId', $parentId);
    }

    protected function getColumnMap(): array
    {
        return [
            0 => 'gallery.id',
        ];
    }

    protected function getSearchableFields(): array
    {
        return [
            'gallery.name'
        ];
    }

    protected function formatData(array $entities): array
    {
        $data = [];

        /** @var Gallery $gallery */
        foreach ($entities as $index => $gallery) {

            $data[] = [
                'index' => $index + 1,

                'id' => $gallery->getId(),

                'parent' => $gallery->getParent()
                    ? $gallery->getParent()->getId()
                    : null,

                'name' => $gallery->getName(),

                'created_at' => $gallery->getCreatedAt()
                    ? $gallery->getCreatedAt()->format('Y-m-d H:i:s')
                    : null,

                'updated_at' => $gallery->getUpdatedAt()
                    ? $gallery->getUpdatedAt()->format('Y-m-d H:i:s')
                    : null,
            ];
        }

        return $data;
    }
}